import {ComponentFixture, TestBed} from '@angular/core/testing';
import {VisualizationsRawDataComponent} from './VisualizationsRawDataComponent';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('VisualizationsRawDataComponent', () => {

  let component: VisualizationsRawDataComponent;
  let fixture: ComponentFixture<VisualizationsRawDataComponent>;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      declarations: [], imports: [HttpClientTestingModule, VisualizationsRawDataComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(VisualizationsRawDataComponent);
    component = fixture.componentInstance;

  });

  afterEach(() => {
    jest.clearAllMocks();
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
